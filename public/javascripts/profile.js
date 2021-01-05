$(function(){
    $("#profile_save").on('click', function(event){
        event.preventDefault();
        var fullname   = $("#profile_fullname").val();
        var email      = $("#profile_email").val();
        var dob        = $("#profile_dob").val();
        var province   = $("#profile_province").val();
        var gender     = $("#profile_gender").val();

        if(!fullname || !email || !dob || !province || !gender){ 

            $("#msgDiv").show().html("请完成所有设置");

        } else {
            $.ajax({
                url: "/homepage/profile",
                method: "POST",
                data: { name: fullname, email: email, dob: dob, province: province, gender: gender}
            }).done(function( data ) {

                if ( data ) {
                    if(data.status == "checkerror"){

                        var errors = '<ul>';
                        $.each( data.message, function( key, value ) {
                            errors = errors + '<li style=list-style:none;>' + value.msg + '</li>';
                        });

                        errors = errors+ '</ul>';
                        $("#msgDiv").html(errors).show();
                    } else if (data.status == "error") {

                        $("#msgDiv").html(data.message).show();

                    } else{
                        $("#msgDiv").removeClass('alert-danger').addClass('alert-success').html(data.message).show(); 
                    }
                }
            });
        }
    });

    $("#profile_password_save").on('click', function(event){
        event.preventDefault();

        var oldpassword        = $("#profile_original_password").val();
        var newpassword        = $("#profile_new_password").val();
        var comfirmedpassword  = $("#profile_comfirmed_password").val();

        var msgalert = $("#msgDiv2");

        if(!oldpassword || !newpassword || !comfirmedpassword){ 
            msgalert.html("请完成填写所有空格").show();
        } else if (newpassword !== comfirmedpassword){
            msgalert.html("新密码与确认密码不一致").show();
        } else {
            $.ajax({
                url: "/homepage/profile",
                method: "PUT",
                data: { oldpassword: oldpassword, newpassword: newpassword}
            }).done(function( data ) {

                if ( data ) {
                    if (data.status == "error") {
                        msgalert.html(data.message).show();
                    } else{
                        msgalert.removeClass('alert-danger').addClass('alert-success').html(data.message).show(); 
                    }
                }
            });
        }
    });
});

// $(function(){
    
// });