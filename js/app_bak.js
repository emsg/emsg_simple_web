// Initialize your app
var app = new Framework7(
    {
        animateNavBackIcon:true,
        pushState:true,
        pushStateSeparator:"#/",
        pushStateNoAnimation:true,
        pushStateRoot:"/new/",
        sortable:false,
        swipeout:true,
        swipeoutNoFollow:true,
        //swipePanel:"left",
        swipePanelNoFollow:true,
        hideNavbarOnPageScroll:"true",
        onAjaxStart:function(xhr){
            //alert();
        },
        onAjaxComplete:function(xhr){

        },
        preroute: function (view, options) {
            var token = window.localStorage.getItem("token");
            if(!token||token==''){
                app.loginScreen();
            }
        }
    });

//使用模版引擎Template7
//var myApp = new Framework7({
//    preprocess: function (content, url, next) {
//        if (url === 'people.html') {
//            var template = Template7.compile(content);
//            var resultContent = template({
//                title: 'People',
//                people: ['John', 'Ivan', 'Mary']
//            })
//            return resultContent;
//        }
//    }
//});

//验证登录
//var myApp = new Framework7({
//    preroute: function (view, options) {
//        if (!userLoggedIn) {
//            view.router.loadPage('auth.html'); //load another page with auth form
//            return false; //required to prevent default router action
//        }
//    }
//});

//var myApp = new Framework7({
//    onPageInit: function (app, page) {
//        if (page.name === 'home') {
//            //Do something here with home page
//        }
//    }
//});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = app.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

// Callbacks to run specific code for specific pages, for example for About page:
app.onPageInit('about', function (page) {
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function () {
        createContentPage();
    });
});


formTrgger = app.onPageInit('form',function(page){
    var query = $$.parseUrlQuery('http://google.com/?id=5&foo=bar');
    console.log(query); //-> {id: 5, foo: 'bar'}
    console.log($$.isArray(["1","2"]));
    console.log($$.unique(["1","2","1"]));

    var hypensCaseString = 'hello-my-world';
    var camelCaseString = $$.toCamelCase(hypensCaseString);
    console.log(camelCaseString); //helloMyWorld

    var dataset = $$.dataset('#my-div');

    /*
     dataset will create plain object with camelCase keys and with formatted boolean and number types:
     {
     loop: true,
     animatePages: false,
     index: 0,
     hello: 'world'
     }
     */
    //<div id="my-div" data-loop="true" data-animate-pages="false" data-index="0" data-hello="world">
    //...
    //</div>
})

// Generate dynamic page
var dynamicPageIndex = 0;
function createContentPage() {
	mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
	return;
}