/*INSTALAÇÃO DO FIREBASE*/

npm install @react-native-firebase/app @react-native-firebase/auth

/*
Configuração
1 - Vá para o Firebase;
2 - Crie um projeto e adicione um aplicativo Android;
3 - Baixe o arquivo google-services.json e coloque na pasta android/app/;
4 - No arquivo android/build.gradle, adicione o plugin do Firebase
*/

dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
}


/* No android/app/build.gradle, aplique o plugin:*/
apply plugin: 'com.google.gms.google-services'

/*Autenticacao.js*/
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AgendaScreen from './screens/AgendaScreen';
import CaixaScreen from './screens/CaixaScreen';
import EstoqueScreen from './screens/EstoqueScreen';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(setUser);
    return unsubscribe; // Desinscreve do listener quando o componente desmonta
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Agenda" component={AgendaScreen} />
            <Stack.Screen name="Caixa" component={CaixaScreen} />
            <Stack.Screen name="Estoque" component={EstoqueScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


/*Login.js*/
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Usuário não encontrado', 'Deseja se cadastrar?', [
          { text: 'Cancelar' },
          {
            text: 'Cadastrar',
            onPress: async () => {
              try {
                await auth().createUserWithEmailAndPassword(email, password);
                Alert.alert('Usuário cadastrado com sucesso!');
              } catch (signupError) {
                Alert.alert('Erro', signupError.message);
              }
            },
          },
        ]);
      } else {
        Alert.alert('Erro', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Corte de Cria - Login</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Senha"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});


/*Agenda.js*/
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function AgendaScreen() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState('');
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('appointments')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(data);
      });

    return unsubscribe;
  }, [userId]);

  const addAppointment = async () => {
    if (!newAppointment.trim()) {
      Alert.alert('Erro', 'O campo de compromisso não pode estar vazio.');
      return;
    }

    try {
      await firestore().collection('appointments').add({
        userId,
        description: newAppointment,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setNewAppointment('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o compromisso.');
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await firestore().collection('appointments').doc(id).delete();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o compromisso.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda</Text>
      <TextInput
        placeholder="Novo compromisso"
        style={styles.input}
        value={newAppointment}
        onChangeText={setNewAppointment}
      />
      <Button title="Adicionar" onPress={addAppointment} />
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.appointment}>
            <Text>{item.description}</Text>
            <Button title="Excluir" onPress={() => deleteAppointment(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  appointment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});



/*Funcionalidade de Criação de Relatórios que permite gerar relatórios de caixa em formato PDF*/
/*Instale a biblioteca necessária:*/
npm install react-native-pdf-lib react-native-fs

/*Conecte ao projeto:*/
npx react-native link react-native-fs

/*Vms adicionar o botão para exportar na tela (RegistroCaixa.js)*/
/*RegistroCaixa.js*/
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';
import { PDFDocument, PDFPage } from 'react-native-pdf-lib';

export default function CaixaScreen() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(data);
      });

    return unsubscribe;
  }, [userId]);

  const addTransaction = async () => {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      await firestore().collection('transactions').add({
        userId,
        amount: parseFloat(amount),
        description,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setAmount('');
      setDescription('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a transação.');
    }
  };

  const generatePDF = async () => {
    try {
      const pdfPath = `${RNFS.DocumentDirectoryPath}/relatorio_caixa.pdf`;

      const page = PDFPage.create()
        .setMediaBox(200, 400)
        .drawText('Relatório de Caixa', { x: 50, y: 350, fontSize: 18 })
        .drawText('Transações:', { x: 20, y: 320 });

      transactions.forEach((t, index) => {
        const lineY = 300 - index * 20;
        page.drawText(`${t.description}: R$ ${t.amount.toFixed(2)}`, { x: 20, y: lineY });
      });

      const pdf = await PDFDocument.create(pdfPath).addPages(page).write();
      Alert.alert('Sucesso', `PDF gerado em: ${pdfPath}`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Caixa</Text>
      <TextInput
        placeholder="Valor"
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        placeholder="Descrição"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />
      <Button title="Registrar" onPress={addTransaction} />
      <Button title="Exportar Relatório" onPress={generatePDF} />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transaction}>
            <Text>{item.description}</Text>
            <Text>R$ {item.amount.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});




/*ControleEstoque.js*/
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function EstoqueScreen() {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const userId = auth().currentUser.uid;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('stock')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(data);
      });

    return unsubscribe;
  }, [userId]);

  const addItem = async () => {
    if (!itemName.trim() || !quantity) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      await firestore().collection('stock').add({
        userId,
        name: itemName,
        quantity: parseInt(quantity, 10),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setItemName('');
      setQuantity('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  };

  const updateItem = async (id, newQuantity) => {
    try {
      await firestore().collection('stock').doc(id).update({
        quantity: newQuantity,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o item.');
    }
  };

  const deleteItem = async (id) => {
    try {
      await firestore().collection('stock').doc(id).delete();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o item.');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.item}>
        <Text>{item.name}</Text>
        <Text>Qtd: {item.quantity}</Text>
        <View style={styles.buttons}>
          <Button
            title="Adicionar"
            onPress={() => updateItem(item.id, item.quantity + 1)}
          />
          <Button
            title="Remover"
            onPress={() => {
              if (item.quantity > 0) {
                updateItem(item.id, item.quantity - 1);
              } else {
                Alert.alert('Aviso', 'A quantidade não pode ser menor que 0.');
              }
            }}
          />
          <Button
            title="Excluir"
            onPress={() => deleteItem(item.id)}
            color="red"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controle de Estoque</Text>
      <TextInput
        placeholder="Nome do item"
        style={styles.input}
        value={itemName}
        onChangeText={setItemName}
      />
      <TextInput
        placeholder="Quantidade"
        style={styles.input}
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
      />
      <Button title="Adicionar Item" onPress={addItem} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  item: {
    flexDirection: 'column',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

