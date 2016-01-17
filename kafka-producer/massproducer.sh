#node massproducer.js --id 1 --topic $1 & node massproducer.js --id 2 --topic $1 & node massproducer.js --id 3 --topic $1 & node massproducer.js --id 4 --topic $1
# f=
# while [ $((f+=1)) -le 8 ]
# do
#   node massproducer.js --id $f --topic $2
# done

max=$1
for i in `seq 1 $max`
do
    node massproducer.js --size $2 &
done
