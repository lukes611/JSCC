
int c = 30;

int main(int argc, char ** argv){

	c = 30;
	{
		{
			c = 30;
		}

	}

	return 0;
		}
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
