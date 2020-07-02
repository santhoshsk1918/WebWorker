this.onmessage = function (e) {
    function analyseWords(wordsArray) {
        return new Promise((resolve, reject) => {
            let wordIndex = {};
            wordIndex[wordsArray[0]] = 1
            wordsArray.forEach((item) => {
                if (wordIndex.hasOwnProperty(item.toLowerCase())) {
                    let count = wordIndex[item.toLowerCase()] + 1;
                    wordIndex[item.toLowerCase()] = count;
                } else {
                    wordIndex[item.toLowerCase()] = 1
                }
            });
            let wordIndexArray = []
            let items = Object.keys(wordIndex);
            for (let i = 0; i < items.length; i++) {
                const obj = {}
                obj.count = wordIndex[items[i]];
                obj.name = items[i];
                wordIndexArray.push(obj);
            }

            let newArray = wordIndexArray.sort(GetSortOrder("count")).slice(0, 10);

            resolve(newArray);
        })
    }

    function GetSortOrder(prop) {
        return function (a, b) {
            if (a[prop] < b[prop]) {
                return 1;
            } else if (a[prop] > b[prop]) {
                return -1;
            }
            return 0;
        }
    }

    const performJob = () => {
        return new Promise((resolve, reject) => {
            getRequest("https://norvig.com/big.txt").then((resp) => {
                return tokenize(resp);
            }).then((resp) => {
                return analyseWords(resp);
            }).then((items) => {
                return getMeanings(items)
            }).then((resp) => {
                console.log(resp);
                resolve(resp);
            }).catch((err) => {
                console.log(err);
                reject(err);
            })
        })

    }

    function getMeanings(itemsArray) {
        return new Promise((resolve, reject) => {
            let promiseList = [];
            let url = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf&lang=en-en&text=";
            for (let i = 0; i < itemsArray.length; i++) {
                let newUrl = url + itemsArray[i].name
                promiseList.push(getRequest(newUrl, false, itemsArray[i]));
            }

            Promise.all(promiseList).then((values) => {
                let finalSet = []
                for(let i=0; i<values.length; i++){
                    let def = values[i].def
                    if(def.length === 0){

                        let finalWord = values[i].specialOject;
                        finalWord.pos = ""
                        finalWord.def = []
                        finalSet.push(finalWord);
                    }else {
                        let finalWord = values[i].specialOject;
                        finalWord.pos = def[0].pos;
                        finalWord.def = def[0].tr;
                        finalSet.push(finalWord);

                    }
                }
                resolve(finalSet);
            })
        })
    }



    function doCORSRequest(options, callback) {
        const cors_api_url = 'https://cors-anywhere.herokuapp.com/';
        const x = new XMLHttpRequest();
        x.open(options.method, cors_api_url + options.url);
        x.onload = x.onerror = function () {
            callback(x.status, x);
        };
        if (/^POST/i.test(options.method)) {
            x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        x.send(options.data);
    }


    function getRequest(url, returnString = true, specialObject = {}) {
        return new Promise((resolve, reject) => {
            doCORSRequest({
                method: 'GET',
                url: url,
            }, function printResult(status, result) {
                if (status == 200) {
                    if(returnString){
                        resolve(result.responseText);
                    }else{
                        let respJson = JSON.parse(result.response)
                        respJson.specialOject = specialObject
                        console.log(respJson);
                        resolve(respJson);
                    }

                } else {
                    reject();
                }
            });
        })
    }

    function tokenize(resp) {
        return new Promise((resolve, reject) => {
            let respArray = resp.split(/\W+/);
            resolve(respArray)
        })
    }

    let performWork = performJob.call();
    performWork.then((resp) => {
        console.log(resp);
        this.postMessage({result: resp, error: null});
    }).catch((err) => {
        this.postMessage({result: null, error: err});
    })

}