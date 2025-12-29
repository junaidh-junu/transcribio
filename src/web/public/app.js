(function() {
  // State
  let currentResult = null;

  // Elements
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const uploadSection = document.getElementById('upload-section');
  const processingSection = document.getElementById('processing-section');
  const resultSection = document.getElementById('result-section');
  const errorSection = document.getElementById('error-section');

  // Initialize
  function init() {
    setupDropZone();
    setupTabs();
    setupExportButtons();
    setupOtherButtons();
  }

  // Drop zone handling
  function setupDropZone() {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-active');
      if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  // Handle file upload
  async function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      showError('Please upload an audio file');
      return;
    }

    // Show processing state
    showSection('processing');
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('processing-status').textContent = 'Uploading audio file...';

    // Get options
    const options = {
      speakers: document.getElementById('opt-speakers').checked,
      timestamps: document.getElementById('opt-timestamps').checked,
      language: document.getElementById('opt-language').value,
      model: document.getElementById('opt-model').value
    };

    // Create form data
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('speakers', options.speakers);
    formData.append('timestamps', options.timestamps);
    formData.append('language', options.language);
    formData.append('model', options.model);

    try {
      document.getElementById('processing-status').textContent = 'Transcribing with Gemini AI...';

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Transcription failed');
      }

      const result = await response.json();
      currentResult = result;
      showResult(result);

    } catch (error) {
      showError(error.message);
    }
  }

  // Show result
  function showResult(result) {
    // Update metadata
    document.getElementById('result-language').textContent = result.language || 'Unknown';
    document.getElementById('result-duration').textContent = result.duration ? `Duration: ${result.duration}` : '';

    // Formatted view
    const formattedEl = document.getElementById('tab-formatted');
    if (result.segments && result.segments.length) {
      formattedEl.innerHTML = result.segments.map(seg => `
        <div class="mb-4">
          <div class="text-xs text-gray-400 mb-1">
            ${seg.timestamp ? `[${seg.timestamp}]` : ''}
            ${seg.speaker ? `<span class="font-medium text-blue-600">${seg.speaker}</span>` : ''}
          </div>
          <p class="text-gray-800">${seg.text}</p>
        </div>
      `).join('');
    } else {
      formattedEl.innerHTML = `<p class="text-gray-800">${result.fullText || 'No transcript available'}</p>`;
    }

    // Plain text view
    document.getElementById('tab-plain').textContent = result.fullText || '';

    // JSON view
    document.getElementById('tab-json').textContent = JSON.stringify(result, null, 2);

    // Summary
    if (result.summary) {
      document.getElementById('result-summary').textContent = result.summary;
      document.getElementById('summary-section').classList.remove('hidden');
    } else {
      document.getElementById('summary-section').classList.add('hidden');
    }

    showSection('result');
  }

  // Tab switching
  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Update button styles
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
          b.classList.add('text-gray-500');
        });
        btn.classList.remove('text-gray-500');
        btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');

        // Show corresponding tab
        const tab = btn.dataset.tab;
        document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('hidden'));
        document.getElementById(`tab-${tab}`).classList.remove('hidden');
      });
    });
  }

  // Export buttons
  function setupExportButtons() {
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!currentResult) return;

        const format = btn.dataset.format;

        try {
          const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: currentResult, format })
          });

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `transcript.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          alert('Export failed: ' + error.message);
        }
      });
    });
  }

  // Other buttons
  function setupOtherButtons() {
    // Copy button
    document.getElementById('btn-copy').addEventListener('click', () => {
      const text = currentResult?.fullText || '';
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy');
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = '📋 Copy', 2000);
      });
    });

    // New transcription button
    document.getElementById('btn-new').addEventListener('click', resetUI);

    // Retry button
    document.getElementById('btn-retry').addEventListener('click', resetUI);
  }

  // Section visibility
  function showSection(section) {
    uploadSection.classList.add('hidden');
    processingSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');

    switch(section) {
    case 'upload': uploadSection.classList.remove('hidden'); break;
    case 'processing': processingSection.classList.remove('hidden'); break;
    case 'result': resultSection.classList.remove('hidden'); break;
    case 'error': errorSection.classList.remove('hidden'); break;
    }
  }

  // Show error
  function showError(message) {
    document.getElementById('error-message').textContent = message;
    showSection('error');
  }

  // Reset UI
  function resetUI() {
    currentResult = null;
    fileInput.value = '';
    showSection('upload');
  }

  // Initialize on load
  init();
})();
