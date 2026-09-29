import { GAME_ID_ALPHABET, GAME_ID_LENGTH } from "../../../common/constants"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "./ui/input-otp"

const CODE_PATTERN = `^[${GAME_ID_ALPHABET}${GAME_ID_ALPHABET.toLowerCase()}]+$`

export function InputCodePattern({
    setCode,
    value = "",
}: {
    setCode: (code: string) => void
    value: string
}) {
    return (
        <InputOTP
            value={value}
            maxLength={GAME_ID_LENGTH}
            pattern={CODE_PATTERN}
            onChange={(value) => setCode(value)}
        >
            <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
            </InputOTPGroup>
        </InputOTP>
    )
}
