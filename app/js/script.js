// Mobile Menu Functionality
const btnHamburger = document.querySelector('#btnHamburger');
const body = document.querySelector('body');
const header = document.querySelector('.header');
const overlay = document.querySelector('.overlay');
const fadeElems = document.querySelectorAll('.has-fade');
const mobileMenu = document.querySelector('.header__menu');

btnHamburger.addEventListener('click', function() {
  if (header.classList.contains('open')) { // Close Menu
    body.classList.remove('noscroll');
    header.classList.remove('open');
    fadeElems.forEach(function(element) {
      element.classList.remove('fade-in');
      element.classList.add('fade-out');
    });
  } else { // Open Menu
    body.classList.add('noscroll');
    header.classList.add('open');
    fadeElems.forEach(function(element) {
      element.classList.remove('fade-out');
      element.classList.add('fade-in');
    });
  }
});

// Close mobile menu when clicking a link
document.querySelectorAll('.header__menu a').forEach(link => {
  link.addEventListener('click', () => {
    body.classList.remove('noscroll');
    header.classList.remove('open');
    fadeElems.forEach(function(element) {
      element.classList.remove('fade-in');
      element.classList.add('fade-out');
    });
  });
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