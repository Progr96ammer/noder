$( document ).ready(function() {
    $(".form-submit").click (function() {
        var dd = $(this).closest('form')[0];
        var formData = new FormData(dd)
        $.ajax({
            processData: false,
            contentType: false,
            type:$(this).closest('form').attr("method"),
            url:$(this).closest('form').attr("action"),
            data:formData,
            success:function(response){
                if (response == 'Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'){
                    alert('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
                    window.location.reload();
                }
                else if (response.errors) {
                    $(".invalid-feedback").remove();
                    $("*").removeClass("is-invalid");
                    for (var i = 0; i < response.errors.length; i++) {
                        if (response.errors[i].msg =='Soory We Cann`t Complete Your Procedure Right Now, Please try again later!'){
                            alert('Soory We Cann`t Complete Your Procedure Right Now, Please try again later!');
                            window.location.reload();
                            break;

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
                window.location.replace("/home");
            },
        });
    });
});

window.loadAndDisplay = function(displayImage) {
    const mimetype = ["jpeg", "png","jpg"];
    var displayImage = document.getElementById(displayImage);
    var extArray = event.target.files[0].type.split("/");
    var extension = extArray[extArray.length - 1];
    if(mimetype.includes(extension)){
        var reader = new FileReader();
        reader.onload = function(){
            displayImage.src = reader.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    }
}

// const fileReader = new FileReader();
// const file = document.getElementById('avatar-input').files[0];
// fileReader.onloadend = () => {
//     const photoData = new Blob([fileReader.result], {type: file.type});
//     const formData = new FormData();
//     formData.append('source', photoData);
//     formData.append('message', 'some status message');
//
//     $.ajax({
//         type:'POST',
//         processData: false,
//         contentType: false,
//         url:'https://graph.facebook.com/v12.0/105202401930878/photos?access_token=EAASlt1IqxFsBAH6cqKj5LWa82kfs7zrpGGcrBA7K9UO8HL9lpIwgZBxfmz2Tushs0WMT7o5W9SNekYUXXVTpOA7MH7MZA9JEwqZBQuuv5tU1qUr9275426URPGT8Qc8Ggk1IXMlurl6IWE2u9e8ux1WmUXXRShNpepqtn5QTjZBKXVmHdszKQQqjQe4ZCfDzCbta4vIUoZAQZDZD',
//         data:formData,
//         success:function(response){
//             alert('done!');
//         },
//         error:function(errors){
//             console.log(errors)
//         },
//     });
// };
// fileReader.readAsArrayBuffer(file);
