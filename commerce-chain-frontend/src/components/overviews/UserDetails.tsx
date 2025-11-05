import type { UserData } from "../../utils/dataTypesUtils";
import type { DetailsProps } from "../../utils/propsUtils";
import { userFontSemibold } from "../../utils/stylingUtils";

export default function UserDetails({ entity: user }: DetailsProps<UserData>) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-purple-400">User Details</h3>
      <div className="grid grid-cols-2 gap-4 text-gray-300">
        <div>
          <span className={userFontSemibold}>ID:</span> {user.id}
        </div>
        <div>
          <span className={userFontSemibold}>Email:</span>{" "}
          {user.email}
        </div>
        <div>
          <span className={userFontSemibold}>Name:</span>{" "}
          {user.name} {user.surname}
        </div>
        <div>
          <span className={userFontSemibold}>Balance:</span> $
          {user.balance.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
