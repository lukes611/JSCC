
void nothing(){}

//yay sorted
void add(int a, int b){
	int c = a + b;
	return c;
}

int main(int argc, char ** argv){

	int a = 5;
	int b = 6;

	int c = a+b;


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
