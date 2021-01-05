(function () {
    "use strict";

    $("#uploadq_singlesave").on('click', function(event){
        event.preventDefault();
        var body = $("#uploadq_description").val();
        var type = $("#uploadq_type").val();
        var answer = $("#uploadq_answer").val();
        var difficulty = $("#uploadq_difficulty").val();
        var subdifficulty = $("#uploadq_subdifficulty").val();
        var hint = $("#uploadq_hint").val();
        var explain = $("#uploadq_explain").val();

        if(!body || !answer || !difficulty || !subdifficulty){ 

            $("#msgDiv").show().html("请完成所有*标内容");

        } else {
            $.ajax({
                url: "/uploadquestions/single",
                method: "POST",
                data: {body: body, type: type, answer: answer, difficulty: difficulty, subdifficulty: subdifficulty, hint: hint, explain: explain}
            }).done(function( data ) {
                if ( data ) {
                    if (data.status == "error") {
                        $("#msgDiv").html(data.message).show();
                    } else{
                        $("#msgDiv").removeClass('alert-danger').addClass('alert-success').html(data.message).show(); 
                    }
                }
            });
        }
    });
})();
