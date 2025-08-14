document.querySelector("button").addEventListener("click", function(){
    birthDate = document.querySelector("input").value; 
    
    let firstDate = new Date(birthDate); 
    let today = new Date(); 
    let age = today.getFullYear() - firstDate.getFullYear(); 
    let monthDiff = today.getMonth() - firstDate.getMonth(); 
    let dateDiff = today.getDate() - firstDate.getDate(); 

    //look for any invalid subtractions in monthDifff and dateDiff
    if(dateDiff < 0){
        monthDiff -= 1;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        dateDiff += prevMonth.getDate(); 
    }
    if(monthDiff < 0){
        age -= 1;
        monthDiff += 12;
    }

    //for every calclation clear the div and then add the new paragraphs
    document.getElementById("result").innerHTML = ""; 

    const newParagraph1 = document.createElement("p"); 
    const newParagraph2 = document.createElement("p"); 
    const newParagraph3 = document.createElement("p"); 
    const newParagraph4 = document.createElement("p"); 

    newParagraph1.innerHTML = age + " years old."; 
    newParagraph2.innerHTML = "Years: " + age; 
    newParagraph3.innerHTML = "Months: " + monthDiff; 
    newParagraph4.innerHTML = "Days: " + dateDiff; 

    document.getElementById("result").append(newParagraph1, newParagraph2, newParagraph3, newParagraph4); 
}); 





