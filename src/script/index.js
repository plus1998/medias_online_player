import { reactive, ref } from 'vue';
import pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc =
    '../../node_modules/pdfjs-dist/build/pdf.worker.js';

const loading = ref(false);
const db = ref('');
const fileName = ref(''); //文件名 （索引）
const fileList = reactive({}); // 文件列表
const pdfFile = ref(''); // 在浏览的文件
const audioFile = ref(''); // 在听的音频
const playAudio = async url => {
    // 播放mp3
    const audio = document.getElementById('mp3');
    audio.src = url;
    await new Promise(resolve => setTimeout(resolve, 500));
    audio.play();
}

export function useIndexDB() {
    // 开启IndexDB
    const openDb = () => {
        return new Promise((resolve, reject) => {
            let db;
            const request = window.indexedDB.open('files', '2020120701');
            request.onsuccess = function (event) {
                db = request.result;
                console.log('数据库打开成功');
                resolve(db);
            };
            request.onerror = reject;
            request.onupgradeneeded = function (event) {
                db = event.target.result;
                if (!db.objectStoreNames.contains('pdf')) {
                    db.createObjectStore('pdf', { keyPath: 'name' });
                }
                resolve(db);
            };
        });
    }
    const add = data => {
        if (!db.value) return;
        return new Promise((resolve, reject) => {
            let request = db.value
                .transaction(['pdf'], 'readwrite')
                .objectStore('pdf')
                .add(data);
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    }
    const remove = name => {
        return new Promise(resolve => {
            const request = db.value.transaction(['pdf'], 'readwrite')
                .objectStore('pdf')
                .delete(name);

            request.onsuccess = resolve;
        })
    }
    const update = data => {
        return new Promise((resolve, reject) => {
            const request = db.value.transaction(['pdf'], 'readwrite')
                .objectStore('pdf')
                .put(data);

            request.onsuccess = resolve;

            request.onerror = reject;
        });
    }
    const findAll = () => {
        if (!db.value) return;
        Object.keys(fileList).map((key) => delete fileList[key]);
        const transaction = db.value.transaction(['pdf']);
        const objectStore = transaction.objectStore('pdf');

        objectStore.openCursor().onsuccess = event => {
            const cursor = event.target.result;
            let first = true;
            if (cursor) {
                const { name, data, audio } = cursor.value;
                if (first && !pdfFile.value) {
                    if (audio) audioFile.value = URL.createObjectURL(audio);
                    if (data) {
                        fileName.value = name;
                        fileList[name] = data;
                        setTimeout(() => pdfFile.value = data, 500);
                    }
                    first = false;
                } else {
                    fileList[name] = data;
                }
                cursor.continue();
            }
        };
    }
    const findOne = name => {
        return new Promise((resolve, reject) => {
            const transaction = db.value.transaction(['pdf']);
            const objectStore = transaction.objectStore('pdf');
            const request = objectStore.get(name);

            request.onerror = reject;

            request.onsuccess =  () =>  {
                if (request.result) resolve(request.result);
            };
        });
    }
    return { db, openDb, findAll, add, findOne, update, remove };
}

export function useShow(rendering, findAll, add, update, pageNumber) {
    const scale = ref(10); // 缩放比例 * 10
    const maxPage = ref(0); // 最大页码
    const inputFile = ref(''); // 输入的文件 input model
    const inputAudio = ref(''); // 输入mp3
    // 每次刷新显示
    const show = async e => {
        if (e) {
            if (!inputFile.value) return;
            rendering.value = true;
            if (e.target && e.target.files && e.target.files[0]) {
                // 文件转 Array Buffer 
                const PDFData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsArrayBuffer(e.target.files[0]);
                    reader.onload = function (e) {
                        const buffer = e.target.result;
                        resolve(buffer);
                    };
                });
                // Buffer 转 Uint8Array
                fileName.value = e.target.files[0].name;
                rendering.value = false;
                pdfFile.value = new Uint8Array(PDFData);
                fileList[fileName.value] = pdfFile.value;
                // 保存到IndexDB
                await add({
                    name: fileName.value,
                    data: pdfFile.value,
                });
            }
            findAll();
            // 会触发watch 直接返回就可以了
            return;
        }
        if (!pdfFile.value) return;
        loading.value = true;
        // pdf渲染
        const loadingTask = pdfjsLib.getDocument(pdfFile.value);
        const pdf = await loadingTask.promise;
        maxPage.value = pdf._pdfInfo.numPages;
        // 渲染的页码
        let page;
        try {
            page = await pdf.getPage(pageNumber.value);
        } catch (error) {
            pageNumber.value = pageNumber.value - 1;
            page = await pdf.getPage(pageNumber.value);
        }
        // 视图容器
        const viewport = page.getViewport({ scale: scale.value / 10 });
        // pdf渲染画布
        const canvas = document.getElementById('pdf-canvas');
        const canvasContext = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext,
            viewport,
        };
        page.render(renderContext);
        loading.value = false;
        inputFile.value = null;
    };
    // 音频播放
    const audioChange = async e => {
        if (e.target && e.target.files && e.target.files[0]) {
            // 读取文件的array buffer 转 blob
            const audioData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(e.target.files[0]);
                reader.onload = function (e) {
                    resolve(e.target.result);
                };
            });
            // blob直接存Indexdb blob转url用于播放
            const blob = new Blob([audioData], { type: 'audio/mp3' });
            const src = URL.createObjectURL(blob);
            audioFile.value = src;
            await playAudio(src);
            await update({ name: fileName.value, data: pdfFile.value, audio: blob });
            inputAudio.value = null;
        }
    }
    return { inputFile, audioChange, scale, maxPage, show, inputAudio };
}


export function useController(findAll, findOne, remove) {
    const rendering = ref(false);
    // 获取列表
    const getList = async () => {
        findAll();
    }
    // 页码控制
    const pageNumber = ref(1);
    const pageDown = show => {
        pageNumber.value++;
        show();
    };
    const pageUp = show => {
        if (pageNumber.value <= 1) return;
        pageNumber.value--;
        show();
    };
    const marks = {
        5: '0.5x',
        10: '1x',
        15: '1.5x',
        20: '2.0x',
    };
    const changePdf = async name => {
        rendering.value = true;
        fileName.value = name;
        pageNumber.value = 1;
        const result = await findOne(name);
        rendering.value = false;
        pdfFile.value = result.data;
        // 音频处理
        if (result.audio) {
            audioFile.value = URL.createObjectURL(result.audio);
            await playAudio(audioFile.value);
        } else {
            audioFile.value = null
        }
    }
    const deleteFile = async name => {
        pdfFile.value = '';
        await remove(name);
        rendering.value = false;
        findAll();
    }
    return { loading, rendering, fileName, fileList, getList, pdfFile, audioFile, pageNumber, pageDown, pageUp, marks, changePdf, deleteFile };
}