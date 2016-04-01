int a[200];
int * c = a;
int b = 100;
c[b+2.5] = 100;

/*
int a = 5;
int b = a;
int p[4];
int * ap = &a;

p[1] = a;
p[2] = *ap;
int * x = p+3;
*x = 90;

[a, p, p, p, p, ap, x]
= a 5
= b a
ref tmp a
= ap tmp
ref tmp2 p 2



*/
