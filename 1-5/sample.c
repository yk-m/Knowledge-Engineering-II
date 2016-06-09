#include <stdio.h>
#include <string.h>

int main(){
    // A～Zを出力
    int i;
    char c[20];
    for(i=0; i<=46; ++i){
        c = 'あ' + i;
        printf("%s", c);
    }
    printf("\n");

    return 0;
}