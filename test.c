struct Person
{
	char * name;
	int age;
};

int add(int a, int b);

int main()
{

	__sys__("print", "hello there");
	int a = 5;
	double d = 5.0;
	float c = 2.0f;
	char * pt = "hi thar";
	int * ptr = &a;

	return 0;
}

int add(int a, int b){
	return a + b;
}
