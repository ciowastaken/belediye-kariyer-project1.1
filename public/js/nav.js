(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const page = location.pathname.split('/').pop() || 'anasayfa.html';
    document.querySelectorAll('.navbar-nav .nav-link[href]').forEach(link=>{
      const href = link.getAttribute('href');
      if(!href || href.startsWith('#') || link.classList.contains('dropdown-toggle')) return;
      link.classList.toggle('active', href.split('/').pop()===page);
    });

    const navbar = document.querySelector('.navbar-custom');
    if(navbar){
      const onScroll=()=>navbar.classList.toggle('scrolled', window.scrollY>30);
      onScroll(); window.addEventListener('scroll', onScroll);
    }
  });
})();
