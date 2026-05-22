const searchBtn = document.getElementById('search-button');
const resetBtn = document.getElementById('reset-button');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const searchSection = document.getElementById('search-section');

// 🔍 Debug: Check if elements exist
console.log('🔍 DOM Elements check:');
console.log('- searchBtn:', searchBtn);
console.log('- resetBtn:', resetBtn);
console.log('- searchInput:', searchInput);
console.log('- resultsDiv:', resultsDiv);
console.log('- searchSection:', searchSection);

let previousState = null;
let suggestions = [];
let currentSuggestionIndex = -1;
let originalInput = '';
let isShowingSuggestion = false;

// 👉 Session ID logic using localStorage
let sessionId = localStorage.getItem("session_id");
if (!sessionId) {
  sessionId = crypto.randomUUID();  // or use any method to generate unique ID
  localStorage.setItem("session_id", sessionId);
}


// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
const queries = [
      "Show me 2bhk flat in Bandra Mumbai", "3bhk flats in Andheri",
      "Luxury villa in Juhu", "Affordable 1bhk in Navi Mumbai",
      "Penthouse in Worli", "Sea facing apartment in Colaba",
      "Flats near Powai lake", "Studio apartment in Versova",
      "4bhk duplex in South Mumbai", "Ready to move flats in Thane",
      "Pre-leased commercial space Mumbai", "Villa with swimming pool in Alibaug",
      "Flats near BKC", "Affordable housing in Dombivli",
      "Furnished flats in Malad", "Luxury apartments in Lower Parel",
      "Office space in Andheri East", "Row house in Kandivali",
      "Flat near Mumbai University", "Flats near international airport",
      "Chawl redevelopment project", "Sea view flats in Marine Drive",
      "Under construction flats in Chembur", "High-rise flats in Mulund",
      "Budget flats in Virar", "2bhk flats in Mira Road",
      "Independent house in Goregaon", "Luxury bungalow in Pali Hill",
      "Service apartments in Bandra", "Smart homes in Panvel",
      "Rental flats in Santacruz", "Flats near metro station",
      "Flats in Borivali East", "Garden facing flats in Vile Parle",
      "Luxury penthouse in Mahalaxmi", "Affordable flats in Kurla",
      "Duplex flats in Powai", "Farmhouse near Karjat"
    ];

    function spawnText() {
      const text = document.createElement("div");
      text.className = "floating-text";
      text.innerText = queries[Math.floor(Math.random() * queries.length)];

      // Random horizontal position
      text.style.left = Math.random() * 90 + "vw";

      // Random font size
      const sizes = ["14px", "18px", "22px"];
      text.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)];

      document.body.appendChild(text);

      // Remove after animation ends
      setTimeout(() => {
        text.remove();
      }, 16000);
    }

    // Slower spawn rate (every 2s)
    setInterval(spawnText, 2000);

    // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

function showInlineSuggestion(originalText, suggestionText) {
  if (originalText === suggestionText) {
    hideInlineSuggestion();
    return;
  }
  
  // Create suggestion element if it doesn't exist
  let suggestionElement = document.getElementById('inline-suggestion');
  if (!suggestionElement) {
    suggestionElement = document.createElement('div');
    suggestionElement.id = 'inline-suggestion';
    suggestionElement.className = 'inline-suggestion';
    searchSection.appendChild(suggestionElement);
  }
  
  // Show the suggestion text with better formatting
  suggestionElement.textContent = suggestionText;
  suggestionElement.style.display = 'block';
  
  // Position it over the input with better alignment
  const inputRect = searchInput.getBoundingClientRect();
  suggestionElement.style.position = 'absolute';
  suggestionElement.style.left = inputRect.left + 'px';
  suggestionElement.style.top = inputRect.top + 'px';
  suggestionElement.style.width = inputRect.width + 'px';
  suggestionElement.style.height = inputRect.height + 'px';
  
  isShowingSuggestion = true;
  console.log('✅ Inline suggestion shown:', suggestionText);
}

function hideInlineSuggestion() {
  const suggestionElement = document.getElementById('inline-suggestion');
  if (suggestionElement) {
    suggestionElement.style.display = 'none';
  }
  isShowingSuggestion = false;
}

function acceptSuggestion() {
  if (isShowingSuggestion && suggestions.length > 0) {
    // Get the best suggestion (highest relevance)
    const bestSuggestion = suggestions[0];
    searchInput.value = bestSuggestion.text;
    hideInlineSuggestion();
    console.log('👆 Suggestion accepted:', bestSuggestion.text, 'Type:', bestSuggestion.type);
    // Trigger search with the accepted suggestion
    searchInput.dispatchEvent(new Event('input'));
  }
}

// 🎯 Keyboard navigation for inline suggestions
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && isShowingSuggestion) {
    e.preventDefault();
    acceptSuggestion();
    return;
  }
  
  if (e.key === 'Escape') {
    hideInlineSuggestion();
    return;
  }
  
  // For regular search functionality
  if (e.key === 'Enter') {
    // Let the debounced search handle this
    return;
  }
});

// Animation to move search bar to top and make it sticky (WITH ANIMATION)
function animateSearchToTop() {
  searchSection.classList.remove("center");
  searchSection.classList.add("searching");
  // Add smooth transition for moving to top
  searchSection.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
  
  // Add padding to body to prevent content jump
  document.body.style.paddingTop = "80px";
  
  console.log('🎬 Animating search bar to top...');
}

// Reset state to center (WITH ANIMATION)
function resetSearchPosition() {
  console.log('🎬 Starting reset animation...');
  
  searchSection.classList.add("center");
  searchSection.classList.remove("searching");
  // Add smooth transition ONLY for reset
  searchSection.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
  
  // Remove padding from body
  document.body.style.paddingTop = "0";
  
  console.log('✅ Reset animation applied');
}

// ✅ Loader control functions with enhanced animations
function showLoader() {
  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");
  // Add entrance animation
  loader.style.animation = "loaderFadeIn 0.3s ease";
  
  // Add loading indicator to search bar
  searchSection.classList.add("loading");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  loader.classList.add("hidden");
  // Reset animation
  loader.style.animation = "";
  
  // Remove loading indicator from search bar
  searchSection.classList.remove("loading");
}

// ⏱️ Debounce function to prevent rapid calls
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// 👂 Listen to typing for auto-complete (immediate, no debounce)
searchInput.addEventListener('input', (e) => {
  const user_input = e.target.value.trim();
  
  // 🎯 Show inline suggestions for auto-complete (immediate response)
  if (user_input.length >= 2) {
    getSuggestions(user_input);
  } else {
    hideInlineSuggestion();
  }
});

// 🔍 Listen to typing for search (debounced)
searchInput.addEventListener('input', debounce(async () => {
  const user_input = searchInput.value.trim();
  
  if (!user_input) {
    resultsDiv.innerHTML = '';
    hideInlineSuggestion();
    return;
  }

  animateSearchToTop();
  resetBtn.classList.remove("hidden");
  showLoader();

  // 🔄 RESET: Clear previous state for standalone search
  // Each search is treated as completely independent - no conversation history maintained
  previousState = null;

  try {
    const response = await fetch('http://localhost:8000/chat-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_input,
        previous_state: null  // 🔄 Always send null for standalone search
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      resultsDiv.innerHTML = `<p class="no-results">❌ ${errorText || "Invalid request"}</p>`;
      hideLoader();
      return;
    }

    const data = await response.json();

    // 🔄 RESET: Don't update previousState - keep it null for next search
    // Each search is standalone - no conversation history maintained
    // if (data.previous_state) {
    //   previousState = data.previous_state;
    // }

    renderCards(data);
  } catch (error) {
    resultsDiv.innerHTML = `<p class="no-results">Something went wrong ❌</p>`;
    console.error(error);
  } finally {
    hideLoader();
  }
}, 500)); // 500ms debounce

resetBtn.addEventListener('click', async () => {
  console.log('🔄 Reset button clicked');
  
  // Add subtle click feedback
  resetBtn.style.transform = "scale(0.95)";
  setTimeout(() => {
    resetBtn.style.transform = "";
  }, 150);
  
  await fetch(`http://localhost:8000/reset-history/${sessionId}`, {
    method: 'DELETE',
  });

  previousState = null;
  resultsDiv.innerHTML = '';
  searchInput.value = '';
  resetBtn.classList.add("hidden");
  
  console.log('🎯 Starting search bar animation to center');
  
  // Use the existing reset function for smooth animation
  resetSearchPosition();
  
  console.log('✅ Search bar animation complete');
  
  // Hide suggestions if any
  hideInlineSuggestion();
});

let itemsPerLoad = 20;
let loadedCount = 0;
let allProperties = [];


function renderMore() {
  const slice = allProperties.slice(loadedCount, loadedCount + itemsPerLoad);
  slice.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${p.name || '--'}</h3>
      <p><strong>City:</strong> ${p.city || '--'}</p>
      <p><strong>Location:</strong> ${p.location || '--'}</p>
      <p><strong>Price:</strong> ₹${p.display_price?.toLocaleString('en-IN') || '--'}</p>
      <p><strong>Area:</strong> ${p.area ?? '--'} sqft</p>
      <p><strong>BHK:</strong> ${p.bhk ?? '--'}</p>
      <p><strong>Status:</strong> ${p.property_status || '--'}</p>
      <p><strong>Developer:</strong> ${p.developer_name || '--'}</p>
    `;
    resultsDiv.appendChild(card);
  });
  loadedCount += itemsPerLoad;
}

resultsDiv.addEventListener("scroll", () => {
  if (resultsDiv.scrollTop + resultsDiv.clientHeight >= resultsDiv.scrollHeight - 50) {
    if (loadedCount < allProperties.length) {
      renderMore();
    }
  }
});

function renderCards(properties) {
  allProperties = properties;
  loadedCount = 0;
  resultsDiv.innerHTML = "";
  renderMore();
}


// Modal carousel with enhanced animations
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close');
const images = document.querySelectorAll('.carousel-image');
let currentImage = 0;

function showModal() {
  modal.classList.remove('hidden');
  showImage(currentImage);
  // Add entrance animation
  modal.style.animation = 'modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
}

function showImage(index) {
  images.forEach((img, i) => {
    if (i === index) {
      img.classList.remove('hidden');
      // Add fade in animation
      img.style.animation = 'fadeIn 0.4s ease';
    } else {
      img.classList.add('hidden');
      img.style.animation = '';
    }
  });
}

document.getElementById('prev').onclick = () => {
  currentImage = (currentImage - 1 + images.length) % images.length;
  showImage(currentImage);
};

document.getElementById('next').onclick = () => {
  currentImage = (currentImage + 1) % images.length;
  showImage(currentImage);
};

closeBtn.onclick = () => {
  // Add exit animation
  modal.style.animation = 'modalFadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.style.animation = '';
  }, 300);
};
