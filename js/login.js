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
        swipePanelNoFollow:true,
        hideNavbarOnPageScroll:"true",
        onAjaxStart:function(xhr){
            app.showIndicator();
        },
        onAjaxComplete:function(xhr) {
            app.hideIndicator();
        }
    });
var $$ = Dom7;
