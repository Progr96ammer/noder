$("#form-submit").click (function() {
  $.ajax({
      type:$("form").attr("method"),
      url:$("form").attr("action"),
      data:$("form").serialize(),
      success:function(response){
        if (response.errors) {
          $(".invalid-feedback").remove();
          $("*").removeClass("is-invalid");
          for (var i = 0; i < response.errors.length; i++) {
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
        console.log(errors);
        alert("Soory We Cann`t Complete Your Procedure Right Now!");
        window.location.replace("/login");
      },
    });
});

$("#logout").click (function() {
  $.ajax({
      type:"post",
      url:"/user/logout",
      success:function(response){
      	window.location.replace("/");
      },
      error:function(){
		alert("Soory We Cann`t Complete Your Procedure Right Now!");
        location.reload();
      },
    });
});

$("#sendEmailVerifycationAgain").click (function() {
    $.ajax({
        type:'POST',
        url:'/user/sendEmailVerify',
        success:function(response){
            if (response.errors) {
                $(".invalid-feedback").remove();
                $("*").removeClass("is-invalid");
                for (var i = 0; i < response.errors.length; i++) {
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
            console.log(errors);
            alert("Soory We Cann`t Complete Your Procedure Right Now!");
            window.location.replace("/login");
        },
    });
});
