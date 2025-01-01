const btnHamburger = document.querySelector('#btnHamburger');
const body = document.querySelector('body');
const header = document.querySelector('.header');
const overlay = document.querySelector('.overlay');
const fadeElems = document.querySelectorAll('.has-fade');
const mobileMenu = document.querySelector('.header__menu');

function closeMenu() {
  body.classList.remove('noscroll');
  header.classList.remove('open');
  fadeElems.forEach(function(element) {
    element.classList.remove('fade-in');
    element.classList.add('fade-out');
  });
}

function openMenu() {
  body.classList.add('noscroll');
  header.classList.add('open');
  fadeElems.forEach(function(element) {
    element.classList.remove('fade-out');
    element.classList.add('fade-in');
  });
}

btnHamburger.addEventListener('click', function(e) {
  e.stopPropagation();
  if (header.classList.contains('open')) {
    closeMenu();
  } else {
    openMenu();
  }
});

// Close menu when clicking outside
document.addEventListener('click', function(e) {
  if (!mobileMenu.contains(e.target) && !btnHamburger.contains(e.target) && header.classList.contains('open')) {
    closeMenu();
  }
});

// Prevent menu from closing when clicking inside it
mobileMenu.addEventListener('click', function(e) {
  e.stopPropagation();
});

// Close mobile menu when clicking menu items
document.querySelectorAll('.header__menu a').forEach(function(link) {
  link.addEventListener('click', closeMenu);
});

// FAQ Functionality
document.querySelectorAll('.faq__question').forEach(question => {
  question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    const toggle = question.querySelector('.faq__toggle');
    
    // Close all other answers
    document.querySelectorAll('.faq__answer').forEach(item => {
      if (item !== answer) {
        item.classList.remove('active');
        item.previousElementSibling.querySelector('.faq__toggle').textContent = '+';
      }
    });
    
    // Toggle current answer
    answer.classList.toggle('active');
    toggle.textContent = answer.classList.contains('active') ? '−' : '+';
  });
});