$( document ).ready(function() {
    $(".form-submit").click (function() {
        $.ajax({
            type:$(this).closest('form').attr("method"),
            url:$(this).closest('form').attr("action"),
            data:$(this).closest('form').serialize(),
            success:function(response){
                if (response == 'Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'){
                    window.location.replace('/home');
                }
                if (response.errors) {
                    $(".invalid-feedback").remove();
                    $("*").removeClass("is-invalid");
                    for (var i = 0; i < response.errors.length; i++) {
                        if (response.errors[i].msg =='Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'){
                            window.location.replace('/home');
                        }
                        $("#"+response.errors[i].param+"-input").addClass("is-invalid");
                        $("#"+response.errors[i].param+"-input").after('<span class="invalid-feedback d-block"><strong id="message-text">'+response.errors[i].msg+'</strong></span>');
                    }
                }
                else {
                    document.body.innerHTML = "";
                    window.location.replace(response.url);
                }
            },
            error:function(errors){
                alert('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
                window.location.replace("/user/login");
            },
        });
    });
});
