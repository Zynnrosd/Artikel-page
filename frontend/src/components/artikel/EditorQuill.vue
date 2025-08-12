<template>
  <div class="quill-editor-wrapper">
    <div ref="editorContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Quill from 'quill';

// Daftar font custom
const Font = Quill.import('formats/font');
Font.whitelist = ['sans', 'serif', 'monospace', 'arial', 'times-new-roman', 'courier-new'];
Quill.register(Font, true);

const props = defineProps({
  modelValue: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);

const editorContainer = ref(null);
let quill;

onMounted(() => {
  const toolbarOptions = [
    ['undo', 'redo'],
    [{ 'font': Font.whitelist }], // Font selector
    [{ 'header': [1, 2, 3, false] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
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

:deep(.ql-editor) {
  color: #333;
  font-size: 1rem;
  line-height: 1.6;
}

/* Styling font selector */
:deep(.ql-font-serif) { font-family: serif; }
:deep(.ql-font-sans) { font-family: sans-serif; }
:deep(.ql-font-monospace) { font-family: monospace; }
:deep(.ql-font-arial) { font-family: Arial, sans-serif; }
:deep(.ql-font-times-new-roman) { font-family: 'Times New Roman', serif; }
:deep(.ql-font-courier-new) { font-family: 'Courier New', monospace; }

/* Tombol undo redo */
:deep(.ql-undo::before) {
  content: '↺';
}
:deep(.ql-redo::before) {
  content: '↻';
}
</style>
