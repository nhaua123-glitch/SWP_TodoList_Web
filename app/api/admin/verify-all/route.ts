import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // Lấy tất cả user chưa xác thực
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return NextResponse.json(
        { error: 'Không thể lấy danh sách user: ' + fetchError.message },
        { status: 400 }
      );
    }

    // Lọc user chưa xác thực
    const unverifiedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    console.log(`Found ${unverifiedUsers.length} unverified users`);

    // Xác thực tất cả user chưa xác thực
    const verificationResults = [];
    
    for (const user of unverifiedUsers) {
      try {
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error(`Failed to verify user ${user.email}:`, updateError);
          verificationResults.push({
            email: user.email,
            status: 'failed',
            error: updateError.message
          });
        } else {
          console.log(`Successfully verified user: ${user.email}`);
          verificationResults.push({
            email: user.email,
            status: 'success'
          });
        }
      } catch (error) {
        console.error(`Error verifying user ${user.email}:`, error);
        verificationResults.push({
          email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }

    return NextResponse.json(
      { 
        message: `Đã xử lý ${unverifiedUsers.length} tài khoản`,
        results: verificationResults,
        totalProcessed: unverifiedUsers.length,
        successCount: verificationResults.filter(r => r.status === 'success').length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi xác thực hàng loạt:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xác thực hàng loạt' },
      { status: 500 }
    );
  }
}
