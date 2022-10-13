const delbtn = document.querySelector("#del");

delbtn.addEventListener("click",function(event){
    // 확인, 취소 고를 수 있는 경고창 꺼내기
    let test = window.confirm("정말 삭제하시겠습니까?");
    // 확인을 누르면 true / 취소를 누르면 false
    if(test === false) {
        // 취소 누르면 페이지 이동 금지
        event.preventDefault();
    }
});