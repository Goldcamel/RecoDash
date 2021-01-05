$(function(){
    $("#history_date_btn").on('click', function(event){
        event.preventDefault();
        var date = $("#history_date").val();

        if(!date){ 

            $("#msgDiv").show().html("请选择日期");

        } else {
            $.ajax({
                url: "/history",
                method: "POST",
                data: {date: date}
            }).done(function( data ) {

                if ( data ) {
                    if (data.status == "error") {
                        $("#msgDiv").html(data.message).show();
                    } else {
                        console.log(data);
                        $("#history_date").attr("value", date);
                        var table = $('#historypage_table').DataTable();
                        $("#history_totalscore").text('总得分: ' + data.total_score);
                        $("#history_totalscore_bar").css("width", data.total_score * 10 + "%");
                        table.ajax.reload();
                    }
                }
            });
        }
    });

    $('#historypage_table').DataTable({
        "destroy" : true,
        // "serverSide": true,
        "processing": true,
        "paging": true,
        "pagingLength": 10,
        "ordering": true,
        ajax: {
            url: '/history/data',
            type: "post",
            data: {date: function() {
                return $("#history_date").val();
            }}
        },
        columns: [{data: "id", render: function(id) {
            return '<a href="/history/' + $("#history_date").val() + '/' + id +'">' + id + '</a>';
        }}, {data: "type"}, {data: "difficulty"}, {data: "subdifficulty"}, {data: "answer"}, {data: "score"}],
    });
});

