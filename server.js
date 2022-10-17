// 설치한것을 불러들여 그 안의 함수 명령어들을 쓰기위해 변수로 세팅
const express = require("express");
// 데이터베이스의 데이터 입력, 출력을 위한 함수명령어 불러들이는 작업
const MongoClient = require("mongodb").MongoClient;
// 시간 관련된 데이터 받아오기위한 moment라이브러리 사용(함수)
const moment = require("moment");
// 로그인 관련 데이터 받아오기위한 작업
// 로그인 검증을 위해 passport 라이브러리 불러들임
const passport = require('passport');
// Strategy(전략) → 로그인 검증을 하기 위한 방법을 쓰기 위해 함수를 불러들이는 작업
const LocalStrategy = require('passport-local').Strategy;
// 사용자의 로그인 데이터 관리를 위한 세션 생성에 관련된 함수 명령어 사용
const session = require('express-session');

const app = express();

// 포트번호 변수로 세팅
const port = process.env.PORT || 8000;
// const port = 8080;


// ejs 태그를 사용하기 위한 세팅
app.set("view engine","ejs");
// 사용자가 입력한 데이터값을 주소로 통해서 전달되는 것을 변환(parsing)
app.use(express.urlencoded({extended: true}));
// css나 img, js와 같은 정적인 파일 사용하려면 ↓ 하단의 코드를 작성해야한다.
app.use(express.static('public'));


// 로그인 관련 작언을 하기 위한 세팅
// 로그인 관련 작업시 세션을 생성하고 데이터를 기록할 때 세션 이름의 접두사 / 세션 변경시 자동저장 유무 설정
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
// passport라이브러리 실행
app.use(passport.initialize());
// 로그인 검증시 세션데이터를 이용해서 검증하겠다.
app.use(passport.session());


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


// 메인페이지
app.get("/",function(req,res){
    res.render("main",{userData:req.user});
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
    db.collection("ex6_board").find().sort({brdid:1}).toArray(function(err,result){
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

// 검색 기능 작업
app.get("/search",function(req,res){

    // db에서 가져온 코드 붙여넣기
    let test = [
            {
              $search: {
                index: 'ex6_search',
                text: {
                  query: req.query.searchResult,
                  path: req.query.searchCategory
                }
              }
            },
            // 필요한 옵션 추가로 넣을 수 있음
            // 이때 들어가는 옵션은 객체의 형식으로 들어간다.
            {
              $sort:{brdid:-1}
            }
          ]
    
        // db에 있는 ex8_board 컬렉션에 접근해서 해당 단어에 맞는 게시글 관련 객체들만 꺼내올것
        db.collection("ex6_board").aggregate(test).toArray(function(err,result){
            res.render("brd_list",{data:result});
            console.log(result)
        });
    });

// 로그인 기능 작업
app.get("/login",function(req,res){
    res.render("login");
});

app.get("/join",function(req,res){
    res.render("join");
})

// 회원가입시 입력한 정보 데이터베이스에 저장
// 회원가입 페이지에서 입력한 내용들을 데이터베이스에 저장
app.post ("/join",function(req,res){
    db.collection("ex9_count").findOne({name:"회원정보"},function(err,result){
        db.collection("ex9_join").insertOne({
            joinno:result.joinCount + 1,
            joinid:req.body.userid,
            joinpass:req.body.userpass,
            joinphone:req.body.userphone,
            joinemail:req.body.useremail
        },function(err,result){
            db.collection("ex9_count").updateOne({name:"회원정보"},{$inc:{joinCount:1}},function(){
                res.redirect("/login");
            });
        });
    });
});

// 실제 로그인 검증하는 경로로 요청
// 입력한 값이 넘어오면 function 전에 검증을 위해 passport 실행해준다
// failureRedirect는 잘못 입력했을 경우 이동할 경로
// function(req,res){} ← 여기에 적는 거는 아이디, 비밀번호 올바르게 입력 시 이동할 페이지 경로
app.post("/login",passport.authenticate('local', {failureRedirect : '/fail'}),function(req,res){
    // 로그인 성공시 메인페이지로 이동
    res.redirect("/");
});

passport.use(new LocalStrategy({
    usernameField: 'userid',    // login.ejs에서 입력한 아이디의 name값
    passwordField: 'userpass',    // login.ejs에서 입력한 비밀번호의 name값
    session: true,      // 세션을 이용할것인지에 대한 여부
    passReqToCallback: false,   // 아이디와 비밀번호 말고도 다른 항목들을 더 검사할것인가에 대한 여부
  }, function (userid, userpass, done) {
    console.log(userid, userpass);
    db.collection('ex9_join').findOne({ joinid: userid }, function (err, result) {
      if (err) return done(err)
  
      // 아이디가 일치하지 않는다면 아래의 동작 수행
      if (!result) return done(null, false, { message: '존재하지않는 아이디 입니다.' })
      // 비밀번호가 일치한다면 아래의 동작 수행
      if (userpass == result.joinpass) {
        return done(null, result)
        // 비밀번호가 일치하지 않다면 아래의 동작 수행
      } else {
        return done(null, false, { message: '비밀번호를 다시한번 확인해 주세요' })
      }
    })
}));

// 데이터베이스에 있는 아이디와 비밀번호가 일치하면
// 세션을 생성하고 해당 아이디와 비밀번호를 기록하여 저장하는 작업
passport.serializeUser(function (user, done) {
    done(null, user.joinid)
});

// 만들어진 세션을 전달해서 다른페이지에서도 해당 세션을 사용할 수 있도록 처리 (페이지 접근 제한)
passport.deserializeUser(function (joinid, done) {
    // 데이터베이스에 있는 아이디로 로그인 했을 때 아이디만 불러와서 다른페이지에서도 세션을 사용할 수 있도록 처리
    db.collection("ex9_join").findOne({joinid:joinid},function(err,result){
        done(null,result)
    });
});

// 로그아웃 기능 작업
app.get("/logout",function(req,res){
    // 서버의 세션을 삭제하고, 본인 웹브라우저의 쿠키를 삭제한다.
    req.session.destroy(function(err,result){
        // 지워줄 쿠키를 선택한다. / 콘솔 로그의 application → cookies에 가면 name에서 확인할 수 있다.
        res.clearCookie("connect.sid")
        // 로그아웃 후 다시 메인페이지로 돌아가기
        res.redirect("/");
    });
});
