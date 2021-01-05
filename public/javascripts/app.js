$(function(){
    $("#login").on('click', function(event){
        event.preventDefault();

        var username = $("#login_username").val();
        var password = $("#login_password").val();
       
        var msgalert = $("#msgDiv");
        if(!username || !password)
        {
            msgalert.html("请输入用户名和密码！").show();
        } else {
            
            $.ajax({
                url: "/",
                method: "POST",
                data: { username: username, password: password}
            }).done(function( data ) {
                if ( data ) {
                    if(data.status == 'checkerror'){
                        var errors = '<ul>';
                        $.each( data.message, function( key, value ) {
                            errors = errors +'<li style=list-style:none;>'+value.msg+'</li>';
                        });

                        errors = errors+ '</ul>';
                        msgalert.html(errors).show();
                    } else if(data.status == 'error') {
                        msgalert.html(data.message).show();
                    } else {
                        msgalert.hide();
                        window.location = "/homepage";  
                    }
                }
            });
        }
    });
});

$(function(){

    $("#register").on('click', function(event){
        event.preventDefault();
        var fullname   = $("#fullname").val();
        var email      = $("#email").val();
        var password   = $("#password").val();
        var cpassword  = $("#cpassword").val();
        var dob        = $("#dob").val();
        var province   = $("#province").val();
        var rank       = $('#rank').val();
        var gender     = $('input[name="gender"]:checked').val(); 
        var terms      = $('input[name="terms"]:checked').val();

        if(!fullname || !email || !password || !cpassword || !dob || !province || !rank || !gender){ 

            $("#msgDiv").show().html("请完成所有问题！");
        } else if(cpassword != password){
            $("#msgDiv").show().html("两次输入密码不一致！");
        } else if (!terms){
            $("#msgDiv").show().html("请仔细阅读并同意所有法律条款！");
        }
        else{ 
            $.ajax({
                url: "/register",
                method: "POST",
                data: { name: fullname, email: email, password: password, cpassword: cpassword, dob: dob, province: province, rank: rank, gender: gender, terms: terms}
            }).done(function( data ) {

                if ( data ) {
                    if(data.status == 'error'){

                        var errors = '<ul>';
                        $.each( data.message, function( key, value ) {
                            errors = errors +'<li>'+value.msg+'</li>';
                        });

                        errors = errors+ '</ul>';
                        $("#msgDiv").html(errors).show();
                    }else{
                        $("#msgDiv").hide();
                        window.location = "/"; 
                    }
                }
            });
        }
    });    
});