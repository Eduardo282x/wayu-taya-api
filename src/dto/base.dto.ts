export interface BaseResponse {
    message: string;
    success: boolean;
}

export const baseResponse: BaseResponse = {
    message: '',
    success: true
}

export const badResponse: BaseResponse = {
    message: '',
    success: false
}