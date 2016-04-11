
int main(int argc, char ** argv){

	int a = 5;
	while(1){
		a *= 10;
		if(a == 1000) break;
	}


	return 0;
}


/*
int add(int a, int b){
	int c = a + b;
	return c;
}

pushFunc add_iii
popArg b
popArg a
+ $t0 a b
= c $t0
c's assembly
popFunc add_iii
ret c
end


*/
