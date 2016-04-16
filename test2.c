int add(int a, int b);

int times(int a, int b){return a*b;}

int d = 5;

int main(int argc, char ** argv){
	

	int i, c =0;
	for(i=0;i<20;i++)
		c = times(add(i,i),i);


	/*
		system(a,b,c..z)
		push z
		...
		push b
		push a
		systemCall
	*/	

	return 0;
}

int add(int a, int b){return a+b;}