import { createSlice } from "@reduxjs/toolkit";


export default createSlice({
    name: 'noticeAdmin',
    initialState: {
        hidden: false,   // ẩn hiện notice lúc mới vào
        state: false,    // đẩy ra đẩy vào
        status: false,   // notice lỗi hay thành công
        title: '',
        text: '',
        processing: false,
    },
    reducers: {
        hiddenNotice: (state) => {
            state.state = false;
            state.hidden = true;
            state.processing = false;
        },
        errorNotice: (state, action) => {
            state.state = true;
            state.status = false;
            state.title = 'fail';
            state.text = action.payload;
            state.hidden = true;
            state.processing = false;
        },
        successNotice: (state, action) => {
            state.state = true;
            state.status = true;
            state.title = 'success';
            state.text = action.payload;
            state.hidden = true;
            state.processing = false;
        },
        processingNotice: (state, action) => {
            state.processing = true;
            state.title = 'Processing';
            state.text = action.payload;
        }
    }
})