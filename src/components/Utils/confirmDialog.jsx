import Swal from "sweetalert2";

export async function confirmDelete({
  title = "Xác nhận xoá",
  text = "Bạn có chắc muốn xoá mục này?",
  confirmText = "Xoá",
  cancelText = "Huỷ",
}) {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

export function showSuccess(msg = "Thành công!") {
  return Swal.fire({
    icon: "success",
    title: msg,
    timer: 1500,
    showConfirmButton: false,
  });
}

export function showError(msg = "Có lỗi xảy ra") {
  return Swal.fire({
    icon: "error",
    title: msg,
  });
}
