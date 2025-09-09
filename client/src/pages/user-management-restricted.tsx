import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldAlert, Users } from "lucide-react";
import { Link } from "wouter";

export default function UserManagementRestricted() {
    return (
        <div className="p-4 lg:p-8 max-w-3xl w-full min-w-0 overflow-x-hidden">
            <div className="mb-5">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-blue-600" />
                    Usuários
                </h2>
                <p className="text-gray-600 mt-2">Visualização restrita — apenas administradores podem gerenciar usuários.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <ShieldAlert className="w-5 h-5 mr-2 text-red-600" />
                        Acesso Restrito
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            Você não tem permissão para gerenciar usuários. Entre em contato com um administrador caso precise de alguma alteração.
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                        <Link href="/settings">
                            <Button variant="outline" className="flex items-center">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Voltar para Configurações
                            </Button>
                        </Link>
                        <Link href="/profile">
                            <Button>Ir para Meu Perfil</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
