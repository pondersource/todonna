const TDR = (function () {
    let pages = [];
    let links = [];

    document.addEventListener("DOMContentLoaded", function(){
        pages = document.querySelectorAll('[data-page]');
        links = document.querySelectorAll('[data-role="link"]');
        //pages[0].className = "active";  - already done in the HTML
        [].forEach.call(links, function(link){
            link.addEventListener("click", navigate);
        });
    });

    function navigate(ev) {

        ev.preventDefault();
        let id = ev.currentTarget.href.split("#")[1];

        let currentTargetId = ev.currentTarget.id;
        var burger = document.querySelector('.navbar-burger');
        var menu = document.querySelector('#' + burger.dataset.target);

        if (ev.currentTarget.id == 'burger' || ev.currentTarget.id == 'logo') {
            burger.classList.toggle('is-active');
            menu.classList.toggle('is-active');
        }

        [].forEach.call(pages, function(page){

            if (ev.currentTarget.id !== 'logo') {
                burger.classList.toggle('is-active');
            }

            if (ev.currentTarget.id !== 'burger') {
                if(page.id === id){
                    page.classList.add('active');
                    burger.classList.toggle('is-active');
                    menu.classList.toggle('is-active');
                } else {
                    page.classList.remove('active');
                }

            }


        });

        return false;
    }


    function openTab(evt, tabName) {

        let i, tabcontent, tablinks;

        tabcontent = document.getElementsByClassName('content-container');
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = 'none';
        }

        tablinks = document.getElementsByClassName('tablinks');
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(' active', '');
            tablinks[i].parentNode.classList.remove('is-active');
        }

        document.getElementById(tabName).style.display = 'block';
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(' active', '');
            tablinks[i].parentNode.classList.remove('is-active');
        }

        evt.currentTarget.parentNode.classList.add('is-active');
    }


    return {
        openTab
    };
})();
