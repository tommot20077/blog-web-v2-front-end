/**
 * 已刪帳（匿名化）使用者的暱稱前綴。
 * 來源：後端 UserNicknamePolicy.DELETED_NICKNAME_PREFIX（UserService 以 prefix + "#" + 8 碼產生）。
 * 此前綴為後端保留字，註冊與改名皆會拒絕，因此可用來判斷暱稱是否屬於已刪帳使用者。
 */
export const DELETED_NICKNAME_PREFIX = '已刪除使用者#'

export const isDeletedUserNickname = (nickname: string | null | undefined): boolean =>
  !!nickname && nickname.startsWith(DELETED_NICKNAME_PREFIX)
