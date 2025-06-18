export interface BaseResponse {
    data?: any;
    message: string;
    success: boolean;
}
export interface BaseResponseLogin extends BaseResponse {
    token: string;
}

export const baseResponse: BaseResponse = {
    data: [],
    message: '',
    success: true
}

export const badResponse: BaseResponse = {
    message: '',
    success: false
}