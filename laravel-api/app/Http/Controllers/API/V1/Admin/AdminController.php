<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    /**
     * 管理者一覧を返す
     */
    public function index(): JsonResponse
    {
        $admins = Admin::orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'created_at', 'updated_at']);

        return response()->json([
            'success' => true,
            'data' => $admins,
        ], 200);
    }

    /**
     * 管理者アカウントを新規作成する
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:admins,email',
            'password'              => ['required', 'confirmed', Password::min(8)],
        ], [
            'name.required'         => '名前を入力してください',
            'email.required'        => 'メールアドレスを入力してください',
            'email.email'           => '正しいメールアドレスを入力してください',
            'email.unique'          => 'このメールアドレスはすでに使用されています',
            'password.required'     => 'パスワードを入力してください',
            'password.confirmed'    => 'パスワードが一致しません',
            'password.min'          => 'パスワードは8文字以上で入力してください',
        ]);

        $admin = Admin::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => '管理者アカウントを作成しました',
            'data'    => [
                'id'         => $admin->id,
                'name'       => $admin->name,
                'email'      => $admin->email,
                'created_at' => $admin->created_at,
            ],
        ], 201);
    }

    /**
     * 管理者アカウントを削除する（自分自身は削除不可）
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentAdmin = auth()->guard('api')->user();

        if ($currentAdmin->id === $id) {
            return response()->json([
                'success' => false,
                'message' => '自分自身のアカウントは削除できません',
            ], 422);
        }

        $admin = Admin::find($id);

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => '管理者が見つかりません',
            ], 404);
        }

        $admin->delete();

        return response()->json([
            'success' => true,
            'message' => '管理者アカウントを削除しました',
        ], 200);
    }
}
