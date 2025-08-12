<template>
  <div class="quill-editor-wrapper">
    <div ref="editorContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Daftar font custom
const Font = Quill.import('formats/font');
Font.whitelist = [
  'arial', 'times-new-roman', 'courier-new',
  'georgia', 'verdana', 'tahoma', 'calibri', 'comic-sans'
];
Quill.register(Font, true);

const Size = Quill.import('formats/size');
Size.whitelist = [
  '8px', '9px', '10px', '11px', '12px', '14px',
  '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '72px'
];
Quill.register(Size, true);

const props = defineProps({
  modelValue: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);

const editorContainer = ref(null);
let quill;

onMounted(() => {
  const toolbarOptions = [
    ['undo', 'redo'],
    [{ 'font': Font.whitelist }],
    [{ size: Size.whitelist }],
    [{ 'header': [1, 2, 3, 4, 5, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ script: 'sub' }, { script: 'super' }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['blockquote', 'code-block'],
    ['clean']
  ];

  quill = new Quill(editorContainer.value, {
    theme: 'snow',
    modules: {
      toolbar: {
        container: toolbarOptions,
        handlers: {
          undo: () => quill.history.undo(),
          redo: () => quill.history.redo()
        }
      },
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true
      }
    },
    placeholder: 'Mulai menulis artikel Anda di sini...'
  });

  // Set value awal
  if (props.modelValue) {
    quill.root.innerHTML = props.modelValue;
  }

  // Update modelValue saat teks berubah
  quill.on('text-change', () => {
    emit('update:modelValue', quill.root.innerHTML);
  });
});

// Sinkronisasi jika value di luar berubah
watch(() => props.modelValue, (newVal) => {
  if (quill && quill.root.innerHTML !== newVal) {
    quill.root.innerHTML = newVal || '';
  }
});
</script>

<style scoped>
.quill-editor-wrapper {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

:deep(.ql-toolbar .ql-font) {
  min-width: 150px;
  height: auto;
  line-height: 1.4;
}

:deep(.ql-toolbar .ql-picker.ql-font .ql-picker-options),
:deep(.ql-toolbar .ql-picker.ql-size .ql-picker-options),
:deep(.ql-toolbar .ql-picker.ql-header .ql-picker-options) {
  max-height: 150px;
  overflow-y: auto;
}

:deep(.ql-toolbar .ql-size) {
  min-width: 60px;
}

/* Styling teks di editor */
:deep(.ql-editor) {
  color: black;
  min-height: 400px;   
  padding: 20px;      
  font-size: 16px;     
  line-height: 1.6;   
}

/* Styling font selector */
:deep(.ql-font-arial) { font-family: Arial, sans-serif; }
:deep(.ql-font-times-new-roman) { font-family: 'Times New Roman', serif; }
:deep(.ql-font-courier-new) { font-family: 'Courier New', monospace; }
:deep(.ql-font-verdana) { font-family: Verdana, sans-serif; }
:deep(.ql-font-georgia) { font-family: Georgia, serif; }
:deep(.ql-font-serif) { font-family: serif; }
:deep(.ql-font-sans) { font-family: sans-serif; }
:deep(.ql-font-monospace) { font-family: monospace; }
:deep(.ql-font-tahoma) { font-family: Tahoma, sans-serif; }
:deep(.ql-font-calibri) { font-family: 'Calibri', sans-serif; }
:deep(.ql-font-comic-sans) { font-family: 'Comic Sans MS', cursive, sans-serif; }

/* ukursn font px */
:deep(.ql-size-8px) { font-size: 8px; }
:deep(.ql-size-9px) { font-size: 9px; }
:deep(.ql-size-10px) { font-size: 10px; }
:deep(.ql-size-11px) { font-size: 11px; }
:deep(.ql-size-12px) { font-size: 12px; }
:deep(.ql-size-14px) { font-size: 14px; }
:deep(.ql-size-16px) { font-size: 16px; }
:deep(.ql-size-18px) { font-size: 18px; }
:deep(.ql-size-20px) { font-size: 20px; }
:deep(.ql-size-24px) { font-size: 24px; }
:deep(.ql-size-28px) { font-size: 28px; }
:deep(.ql-size-32px) { font-size: 32px; }
:deep(.ql-size-36px) { font-size: 36px; }
:deep(.ql-size-48px) { font-size: 48px; }
:deep(.ql-size-72px) { font-size: 72px; }

/* SHOW FONT NAMES IN DROPDOWN */
:deep(.ql-picker.ql-font .ql-picker-label[data-value="arial"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="arial"]::before) {
  content: "Arial";
  font-family: Arial, sans-serif;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before) {
  content: "Times New Roman";
  font-family: 'Times New Roman', serif;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="courier-new"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="courier-new"]::before) {
  content: "Courier New";
  font-family: 'Courier New', monospace;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="verdana"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before) {
  content: "Verdana";
  font-family: Verdana, sans-serif;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="georgia"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before) {
  content: "Georgia";
  font-family: Georgia, serif;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="tahoma"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="tahoma"]::before) {
  content: "Tahoma";
  font-family: Tahoma, sans-serif;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="calibri"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="calibri"]::before) {
  content: "Calibri";
  font-family: 'Calibri', sans-serif;
}
:deep(.ql-picker.ql-font .ql-picker-label[data-value="calibri"]::before),
:deep(.ql-picker.ql-font .ql-picker-item[data-value="calibri"]::before) {
  content: "Comic Sans MS";
  font-family: 'Comic Sans MS' , cursive, sans-serif;
}

/* SHOW FONT SIZE VALUES IN DROPDOWN */
:deep(.ql-picker.ql-size .ql-picker-label[data-value="8px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="8px"]::before) {
  content: "8px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="9px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="9px"]::before) {
  content: "9px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="10px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="10px"]::before) {
  content: "10px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="11px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="11px"]::before) {
  content: "11px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="12px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="12px"]::before) {
  content: "12px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="14px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="14px"]::before) {
  content: "14px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="16px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="16px"]::before) {
  content: "16px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="18px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="18px"]::before) {
  content: "18px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="20px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="20px"]::before) {
  content: "20px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="24px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="24px"]::before) {
  content: "24px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="28px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="28px"]::before) {
  content: "28px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="32px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="32px"]::before) {
  content: "32px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="36px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="36px"]::before) {
  content: "36px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="48px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="48px"]::before) {
  content: "48px";
}
:deep(.ql-picker.ql-size .ql-picker-label[data-value="72px"]::before),
:deep(.ql-picker.ql-size .ql-picker-item[data-value="72px"]::before) {
  content: "72px";
}

/* Tombol undo redo */
:deep(.ql-undo::before) {
  content: '↺';
}
:deep(.ql-redo::before) {
  content: '↻';
}
</style>
