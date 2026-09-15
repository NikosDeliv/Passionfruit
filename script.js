const result = document.getElementById('result');
const passionImage = document.getElementById('passionImage');

function countPassionWords(text) {
  const normalizedText = text.toLowerCase();
  const passionCount = (normalizedText.match(/\bpassion\b/g) || []).length;
  const passionateCount = (normalizedText.match(/\bpassionate\b/g) || []).length;

  return { passionCount, passionateCount };
}

function showResult(text, isError = false) {
  result.textContent = text;
  result.classList.toggle('error', isError);
}

function displayCounts(text) {
  const { passionCount, passionateCount } = countPassionWords(text);
  showResult(`Passion: ${passionCount}, Passionate: ${passionateCount}`);
  passionImage.style.display = passionCount + passionateCount > 0 ? 'inline-block' : 'none';
}

async function analyzeFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    showResult('Choose a .txt or .pdf file first.', true);
    return;
  }

  showResult('Analyzing file...');

  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      if (!window.pdfjsLib) {
        throw new Error('PDF support is unavailable. Refresh the page and try again.');
      }

      const buffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      const pages = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(' '));
      }

      displayCounts(pages.join('\n'));
      return;
    }

    displayCounts(await file.text());
  } catch (error) {
    showResult(`Could not analyze file: ${error.message}`, true);
    passionImage.style.display = 'none';
  }
}

async function analyzeURL() {
  const urlInput = document.getElementById('urlInput');
  const rawUrl = urlInput.value.trim();

  if (!rawUrl) {
    showResult('Enter a URL first.', true);
    return;
  }

  let url;
  try {
    url = new URL(rawUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Use an HTTP or HTTPS URL.');
    }
  } catch (error) {
    showResult(`Invalid URL: ${error.message}`, true);
    return;
  }

  showResult('Fetching URL...');

  try {
    const response = await fetch(url.href);
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}).`);
    }

    const html = await response.text();
    const documentContent = new DOMParser().parseFromString(html, 'text/html');
    documentContent.querySelectorAll('script, style, noscript').forEach((element) => element.remove());
    displayCounts(documentContent.body?.textContent || html);
  } catch (error) {
    showResult(`Could not analyze URL. The site may block browser requests (CORS).`, true);
    passionImage.style.display = 'none';
  }
}

document.getElementById('fileInput').addEventListener('change', () => {
  showResult('Ready to analyze the selected file.');
});