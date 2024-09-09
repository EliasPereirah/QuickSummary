const  MY_GEMINI_API_KEY = "" // your api key here - take it for free at https://aistudio.google.com/app/apikey
let is_busy = false;
let model = 'gemini-1.5-flash';
let tot_generation = 0;
const all_languages = {
    en: 'English',
    pt: 'Portuguese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    zh: 'Chinese',
    ru: 'Russian',
    ar: 'Arabic',
    ko: 'Korean',
    hi: 'Hindi',
    bn: 'Bengali',
    pa: 'Punjabi',
    ur: 'Urdu',
    fa: 'Persian',
    tr: 'Turkish',
    vi: 'Vietnamese',
    tl: 'Filipino',
    ms: 'Malay',
    id: 'Indonesian',
    th: 'Thai',
    sw: 'Swahili',
    pl: 'Polish',
    uk: 'Ukrainian',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    fi: 'Finnish',
    da: 'Danish',
    el: 'Greek',
    hu: 'Hungarian',
    cs: 'Czech',
    ro: 'Romanian',
    bg: 'Bulgarian',
    he: 'Hebrew'
};

if(MY_GEMINI_API_KEY == ""){
    showResult("<h2 class='warning'>You do not have any API key setup</h2>")
}

let lang_code = navigator.language.substring(0,2);
let browser_lang = all_languages[lang_code] ?? ' in the same language the text is written';
let generated_content = '';
let  page_content = '';

showdown.setFlavor('github');
let converter = new showdown.Converter();
function start(){
    $(document).ready(function() {
        window.onkeydown = (event) => {
            let is_input_area = ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName);
            // verifica se é textarea ou input
            if(!is_input_area){
                // caso não, também verifica se é um contentEditable
                is_input_area = document.activeElement.isContentEditable;
            }
            if (event.key === 'x' && event.ctrlKey && !is_input_area){
                if(!is_busy){
                    if(document.URL.match(/youtube.com/)){
                      //
                    }else{
                        if(tot_generation < 2){
                            page_content = getReadableContent();
                            showResult('A summary is being generated, please wait!',2,'ext_generating')
                            let prompt = `Make a detailed summary of the text: <text>${page_content}</text> The summary must be in ${browser_lang}`;
                            summarize(prompt);
                        }else {
                            showResult(generated_content,0, 'ext_cached_cnt'); // exibe geração anterior
                        }
                    }
                }else{
                    showResult('A summary is being generated, please wait!',2,'ext_generating')
                }

            }
        }
    });
}

function getReadableContent(){
    let documentClone = document.cloneNode(true);
    let parsed = new Readability(documentClone).parse();
    let content = stripHtml(parsed.content);
    let title = stripHtml(parsed.title);
    content = `<h1>${title}</h1>\n<article>${content}</article>`;
    content = content.replace(/\s+/g, ' ');
    content = content.replace(/<\/h1>/, '<\/h1>\n');
    return content;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

document.onreadystatechange = (() => {
    let r_state = document.readyState;
    if(r_state === "complete" || r_state === "interactive"){
        start();
    }
  });



function summarize(prompt) {
    if(!is_busy){
        is_busy = true;
        const data = {
            "contents": [{
                "parts": [{
                    "text": prompt

                }]
            }]
        };
        data.safetySettings = [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
            },
        ];


        data.generationConfig = {
            "maxOutputTokens" : 1000000,
            "temperature" : 0.9
        };


        let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${MY_GEMINI_API_KEY}`

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                return response.json();
            })
            .then(data => {
                // Processar a resposta da API aqui
                tot_generation++;
                showResult(data);
            })
            .catch(error => {
                showResult(error);
            }).finally(()=>{
            is_busy = false;
        })
    }
}


/**
 * Exibe conteúdo na rela
 * @param result string|object conteúdo/texto a ser exibido
 * @param duration int Duração em segundos da mensagem em tela
 *  - 0 para permanente até que o usuário clique em fechar
 * @param class_name Adiciona uma classe opcional
 * **/
function showResult(result, duration = 0, class_name ='') {
    let has_old = document.querySelector("#ext_summary");
    if(has_old){
        has_old.remove();
    }
    let ele = document.createElement('div');
    ele.id = 'ext_summary';
    let close = document.createElement('div');
    close.id = 'ext_close_summary';
    close.addEventListener('click', () => {
        ele.remove();
    });
    if(duration >= 1){
        duration = duration * 1000;
        setTimeout(()=>{
            ele.remove();
        },duration);
    }
    let text = '';
    if (typeof result === "object") {
        try {
            text = result.candidates[0].content.parts[0].text;
            text = converter.makeHtml(text);
            generated_content = text;
        } catch {
           showResult('Error parsing candidate');
        }
    } else {
        text = result;
    }
    let item = document.createElement('div');
    item.classList.add('ext_item');
    if(class_name){
        item.classList.add(class_name);
    }
    item.innerHTML = text;
    let div_ele = document.createElement('div');
    div_ele.append(close);
    item.prepend(div_ele);
    ele.append(item);
    let chat = document.createElement('div');
    chat.id ='ext_chat';
    chat.innerHTML = `<textarea id="ext_ta" placeholder="Ask something"></textarea><button>Ask</button>`;
    let btn = chat.querySelector("button");
    item.append(chat);
    btn.onclick = ()=>{
        let question = chat.querySelector("textarea").value.trim();
        if(question.length > 4){
            question = `Question: ${question}\n text: ${page_content}\n Response in ${browser_lang}`;
            summarize(question)
        }
    }

    document.body.prepend(ele);
}