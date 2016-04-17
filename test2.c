
//struct Person{/
//	char name[20];
//	int age;
//	double d;
//};

/*
struct: a ptr
1 * 20 0
4 * 1 20
8 * d 24

names: name, age, d
indices: 0, 20, 24

struct Person p;
p.age = 25;
p.d = 2.0;

tmp = p + 20 //tmp is a pointer to type char
convertTo int* from char* tmp1 tmp
dref r1 tmp1
return tmp1



name = person
type var(|[]), var(|[])... ;
type ...

*/
struct Node{
	int data;
	struct Node * next;
};

struct LinkedList{
	struct Node * head;
	int length;
};

void main(){
	int i;
	for(i = 0; i < 5; i++){
		i -= 1;
		while(i < 5) i++;
	}	


}
