// Pretty version:
// const averageScript = `
// local averages = {}
// for i=1, 4 do
//   local set = redis.call('zrange', KEYS[i], ARGV[1], ARGV[2], ARGV[3])
//   local sum = 0
//   local total = 0
//   for i=1, #set-1, 2 do
//     sum = sum + set[i] * set[i+1]
//     total = total + set[i+1]
//   end
//   averages[#averages+1] = sum / total
// end
// return averages
// `;

// Transferable version
module.exports = "local averages={}\nfor i=1,#KEYS do\nlocal set=redis.call('zrange',KEYS[i],ARGV[1],ARGV[2],ARGV[3])\nlocal sum=0\nlocal total=0\nfor i=1,#set-1,2 do\nsum=sum+set[i]*set[i+1]\ntotal=total+set[i+1]\nend\naverages[#averages+1]=sum/total\nend\nreturn averages";
