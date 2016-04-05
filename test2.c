int a = 1, count = 0, to = 15;

while(1){
	if(count % 2 == 0) continue;
	a *= 10;
	count += 1;
	if(count >= to) break;
}

/*
while(a) b

goto Test
label whileStart
b's assembly
label Test
a's assembly
ifngoto a endLabel
goto whileStart
label endLabel


continue goes to Test
break goes to endLabel

*/
