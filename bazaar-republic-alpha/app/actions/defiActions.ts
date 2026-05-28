"use server";

export async function registerSecurityCircle(formData: FormData) {
  return { success: true, message: "Registered" };
}

export async function getSecurityCircleStatus(pioneerId: string) {
  return { success: true, data: { stake_amount: 1500 } };
}

export async function getUserStakeTotal(pioneerId: string) {
  return 1500;
}

export async function getNetworkTotalEquity() {
  return { total: 226500 };
}