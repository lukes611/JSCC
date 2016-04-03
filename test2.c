int array[100], i;
for(i = 0; i < 100; i+=1) array[i] = i;

int searchItem = 76;
int start = 0, end = 99;
int found = 0;
for(;;){
	int middle = start + (end - start) / 2;
	if(array[middle] == searchItem){
		found = 1;
		break;
	}
	if(searchItem < array[middle])
		end = middle;
	else start = middle;
}




/*
for(a;b;c) d

output assembly >>

a
label l1
d
label l2
c
ifngoto b l1
label l0

here: in d, break goes to l0, continue goes to l2





for(){}
while(){}

*/
