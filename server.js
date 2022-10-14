// 설치한것을 불러들여 그 안의 함수 명령어들을 쓰기위해 변수로 세팅
const express = require("express");
// 데이터베이스의 데이터 입력, 출력을 위한 함수명령어 불러들이는 작업
const MongoClient = require("mongodb").MongoClient;
// 시간 관련된 데이터 받아오기위한 moment라이브러리 사용(함수)
const moment = require("moment");
const app = express();

// 포트번호 변수로 세팅
const port = process.env.PORT || 8000;


// ejs 태그를 사용하기 위한 세팅
app.set("view engine","ejs");
// 사용자가 입력한 데이터값을 주소로 통해서 전달되는 것을 변환(parsing)
app.use(express.urlencoded({extended: true}));
// css나 img, js와 같은 정적인 파일 사용하려면 ↓ 하단의 코드를 작성해야한다.
app.use(express.static('public'));

// Mongodb 데이터 베이스 연결작업
// 데이터베이스 연결을 위한 변수 세팅 (변수의 이름은 자유롭게 지어도 ok)
let db;
// Mongodb에서 데이터베이스를 만들고 데이터베이스 클릭 → connect → Connect your application → 주소 복사, password에는 데이터베이스 만들때 썼었던 비밀번호를 입력해 준다.
MongoClient.connect("mongodb+srv://admin:qwer1234@testdb.g2xxxrk.mongodb.net/?retryWrites=true&w=majority",function(err,result){
    // 에러가 발생했을 경우 메세지 출력 (선택사항임. 안쓴다고 해서 문제가 되지는 않는다.)
    if(err){ return console.log(err);}

    // 위에서 만든 db변수에 최종적으로 연결 / ()안에는 mongodb atlas에서 생성한 데이터 베이스 이름 집어넣기
    db = result.db("testdb");

    // db연결이 제대로 되었다면 서버 실행
    app.listen(port,function(){
        console.log("서버연결 성공");
    });
});

// // get → a태그나 주소창에 기입한 url /
// // post → 폼태그에서 입력시 요청 req 응답 res
// app.get("/",function(req,res){
//     // ↑하나의 요청에 ↓응답은 한번만
//     // res.send("메시지 보낼때")
//     // res.sendFile(__dirname + "/index.html");
//     // res.sendFile(__dirname + "/public/index.html");
//     // res.render("ejs파일명");
//     // res.redirect("/원하는 경로명");
// });

// 메인페이지
app.get("/",function(req,res){
    res.render("main");
});


// 게시글 작성 페이지 경로 요청
app.get("/insert",function(req,res){
    res.render("brd_insert");
});

app.post("/add",function(req,res){
    let date = moment().format("YYYY-MM-DD HH:mm")
    db.collection("ex6_count").findOne({name:"문의게시판"},function(err,result){
        db.collection("ex6_board").insertOne({
            brdid:result.totalCount + 1,
            brdtitle:req.body.title,
            brdcontext:req.body.context,
            brdauther:req.body.auther,
            // 현재 시간 작업
            brddate:date,
            // 조회수 작업
            brdviews:0
        },function(err,result){
            db.collection("ex6_count").updateOne({name:"문의게시판"},{$inc:{totalCount:1}},function(err,result){
                // 목록 페이지로 이동 → 이후 상세페이지로 변경 예정
                res.redirect("/list");
            });
        });
    });
});

app.get("/list",function(req,res){
    // 데이터베이스에서 게시글 관련 데이터를 꺼내서 가져온 후 brd_list.ejs 전달
    db.collection("ex6_board").find().toArray(function(err,result){
        res.render("brd_list.ejs",{data:result});
    });
})

app.get("/detail/:no",function(req,res){
    // 주소창을 통해서 보내는 데이터값이나 폼태그에서 입력한 데이터값들은 전부 string
    // 게시글이 있는 컬렉션에 게시글 번호값은 정수데이터라 데이터 유행을 매칭해야한다 
    // 글 상세페이지 접속시 해당 글 조회수가 1씩 증가되도록 작업 ↓
    db.collection("ex6_board").updateOne({brdid:Number(req.params.no)},{$inc:{brdviews:1}},function(err,result){
        // 제목 누르면 해당 게시글의 상세페이지 접속 ↓
        db.collection("ex6_board").findOne({brdid:Number(req.params.no)},function(err,result){
            res.render("brd_detail.ejs",{data:result});
        });
    });
});

// 수정 경로로 요청시 수정하는 화면 페이지 응답
app.get("/uptview/:no",function(req,res){
    db.collection("ex6_board").findOne({brdid:Number(req.params.no)},function(err,result){
        res.render("brd_uptview",{data:result});
    });
});

// 수정 끝내고 내가 수정한 데이터들로 변경
app.post("/update",function(req,res){
    db.collection("ex6_board").updateOne({brdid:Number(req.body.id)},{$set:{
        brdtitle:req.body.title,
        brdcontext:req.body.context,
        brdauther:req.body.auther
    }},function(err,result){
        res.redirect("/detail/" + req.body.id);
    });
});

// /delete/게시글 번호로 요청했다면 
app.get("/delete/:no",function(req,res){
    // 해당 게시글 번호의 객체만 삭제
    db.collection("ex6_board").deleteOne({brdid:Number(req.params.no)},function(err,result){
        res.redirect("/list");
    })
});