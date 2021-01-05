$(function(){
    $("#submit").on('click', function(event){
        event.preventDefault();
        var answer = $("#answer").val();
        console.log(answer);
        $("#answerDiv").show();
    })
});
