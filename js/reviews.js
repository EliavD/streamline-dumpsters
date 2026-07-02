/*
================================================================================
REVIEWS.JS - Streamline Dumpsters Ltd. Customer Reviews
================================================================================
Paginated 3-up grid. 18 reviews, 3 per page = 6 pages.
================================================================================
*/

const reviews = [
  { name: "Janet Johnson", time: "1 week ago", text: "I was able to get a dumpster to my house in just a couple of hours. It was delivered perfectly. When it was time for it to leave again, a couple of hours and it was gone. I will definitely use the service again. Thanks, Eli!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "X Johnson", time: "1 week ago", text: "Eli was amazing and the dumpster was exactly what we needed. He was prompt with delivery (even on short notice) and pick-up. He was even able to back his trailer around a 90° corner to get the dumpster exactly where we needed it.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Evan Linepensel", time: "3 days ago", text: "Great price, great customer service, and great communication. Eli was very helpful, courteous, and had great communication throughout the process. I'm grateful I found Streamline and I will definitely use them again.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Adam Saleh", time: "1 week ago", text: "Very responsive, delivered within a couple of hours and picked up early upon my request within a couple of hours.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Ben Gabriel", time: "2 weeks ago", text: "Streamline dumpsters are great! My enquiry was answered same day and once everything was agreed upon and paid they delivered to my driveway same day. Will use them again.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Andres Torres", time: "3 months ago", text: "Great service! It was quick and drop off was earlier than expecting making our move much easier.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Stephanie West", time: "3 months ago", text: "Great communication, prompt delivery and very affordable. We will be using them again.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Biz Velleca", time: "4 months ago", text: "Incredible service! Thank you Eli!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Lisa", time: "4 months ago", text: "Fantastic service! So quick and easy. We will definitely use Streamline Dumpsters again in the future!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Nick Walker", time: "5 months ago", text: "Eli was very professional and prompt in getting the dumpster delivered. He was very careful during the drop off to ensure no damage occurred on the concrete. I'll be going back to him next time I need a dumpster!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Dan Gore", time: "8 months ago", text: "We had a great experience — Responsive, on time, easy to work with and a good value.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Jim Toth", time: "11 months ago", text: "What a pleasure doing business with Streamline! On time, professional, courteous and reasonable. Will use again.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Brycen Levings", time: "10 months ago", text: "Fantastic service overall from the team! Fast and complete wonderful communication!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Nick Fire", time: "10 months ago", text: "Amazing service! Thank you very much.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Amanda Furnari", time: "10 months ago", text: "I like the blue color, and of course the service.", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Jamie Hartman", time: "10 months ago", text: "Great service!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Hannah Levings", time: "10 months ago", text: "I had a great experience — the team was amazing. Great communication and very friendly. I will be using them again in the future!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
  { name: "Rebecca Levings", time: "10 months ago", text: "Eli was very helpful explaining the dumpster process to me. Very prompt and thorough. Would rent again!", link: "https://g.co/kgs/sl-dumpsters-reviews" },
];

const PER_PAGE = 3;
let currentPage = 0;
const totalPages = Math.ceil(reviews.length / PER_PAGE);

function getInitial(name) {
  return name.charAt(0).toUpperCase();
}

function renderReviews() {
  const grid = document.getElementById('reviewGrid');
  const pageEl = document.getElementById('reviewPage');
  if (!grid) return;

  const slice = reviews.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE);

  grid.innerHTML = slice.map(r => `
    <div class="review-card">
      <div class="review-rating">★★★★★</div>
      <p class="review-text">${r.text}</p>
      <a class="review-link" href="${r.link}" target="_blank" rel="noopener noreferrer">Read full review ›</a>
      <div class="review-author">
        <div class="review-avatar">${getInitial(r.name)}</div>
        <div>
          <div class="review-name">${r.name}</div>
          <div class="review-time">${r.time}</div>
        </div>
      </div>
    </div>
  `).join('');
  pageEl.textContent = (currentPage + 1) + ' / ' + totalPages;
  document.getElementById('reviewPrev').disabled = currentPage === 0;
  document.getElementById('reviewNext').disabled = currentPage === totalPages - 1;
}

document.getElementById('reviewPrev').addEventListener('click', () => {
  if (currentPage > 0) { currentPage--; renderReviews(); }
});
document.getElementById('reviewNext').addEventListener('click', () => {
  if (currentPage < totalPages - 1) { currentPage++; renderReviews(); }
});

renderReviews();
