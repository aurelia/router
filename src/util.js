export function extend(obj) {
	var rest = Array.prototype.slice.call(arguments, 1);

	for (var i = 0, length = rest.length; i < length; i++) {
		var source = rest[i];

		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	}

	return obj;
}

export function processPotential(obj, resolve, reject){
  if(obj && typeof obj.then === 'function'){
    var dfd = obj.then(resolve);

    if(typeof dfd.catch === 'function'){
      return dfd.catch(reject);
    } else if(typeof dfd.fail === 'function'){
      return dfd.fail(reject);
    }

    return dfd;
  } else{
    try{
      return resolve(obj);
    }catch(error){
      return reject(error);
    }
  }
}