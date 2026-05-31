<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreAdminRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:admins,email',
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required'      => '名前を入力してください',
            'email.required'     => 'メールアドレスを入力してください',
            'email.email'        => '正しいメールアドレスを入力してください',
            'email.unique'       => 'このメールアドレスはすでに使用されています',
            'password.required'  => 'パスワードを入力してください',
            'password.confirmed' => 'パスワードが一致しません',
            'password.min'       => 'パスワードは8文字以上で入力してください',
        ];
    }
}